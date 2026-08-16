<%@ Page Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false"
    CodeFile="AdminProfile.aspx.vb" Inherits="AdminProfile" Title="Admin Profiles" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
            <asp:Image ID="Img2" runat="server" ImageUrl="~/Images/ajax-loader1.gif"></asp:Image>
            <asp:Label ID="Label1" runat="server" Text="Please Wait...." ForeColor="Red" Font-Bold="True"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="border-right: 1px solid; border-top: 1px solid; font-size: 11px; border-left: 1px solid;
                width: 99%; border-bottom: 1px solid; font-family: Arial, Helvetica, sans-serif;
                height: 232px; background-color: #ffffff">
                <tbody>
                    <tr>
                        <td colspan="2">
                            <asp:LinkButton ID="LinkButton1" OnClick="LinkButton1_Click" runat="server" Width="96px"
                                Font-Size="Small">Add New </asp:LinkButton>
                        </td>
                        <td style="width: 6px">
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; width: 116px; color: #153e7e">
                            <strong>Profile &nbsp;Name</strong>
                        </td>
                        <td>
                            <asp:TextBox ID="txtProfileName" runat="server" Width="251px" BackColor="White" CssClass="tinyText"></asp:TextBox>
                        </td>
                        <td style="width: 6px">
                            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" Width="153px"
                                Font-Bold="False" Font-Size="Small" ValidationGroup="Employee" ErrorMessage="Enter Profile Name"
                                ControlToValidate="txtProfileName"></asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 116px" valign="top">
                            <strong style="color: #153e7e">Comments</strong><asp:HiddenField ID="HiddenField1"
                                runat="server"></asp:HiddenField>
                        </td>
                        <td valign="top">
                            <asp:TextBox ID="txtComments" runat="server" Width="252px" BackColor="White" Height="100px"
                                CssClass="tinyText" TextMode="MultiLine"></asp:TextBox>
                        </td>
                        <td style="width: 6px" valign="top">
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <telerik:RadButton ID="CmdSave" runat="server" Text="Save" Width="70px">
                            </telerik:RadButton>
                            <telerik:RadButton ID="Cancel" runat="server" Text="Cancel" Width="70px">
                            </telerik:RadButton>
                        </td>
                        <td style="width: 6px">
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <asp:Label ID="Label2" runat="server" ForeColor="Red"></asp:Label>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">&nbsp;
                        </td>
                    </tr>
                    <tr>
                        <td style="height: 18px" colspan="3">
                            <strong style="font-weight: bold; color: #806517">Profile Listing</strong>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <telerik:RadGrid ID="GDProfile" runat="server" AutoGenerateColumns="False" CellSpacing="0"
                                GridLines="None" Skin="WebBlue" AllowFilteringByColumn="True" AllowPaging="True"
                                AllowSorting="True">
                                <MasterTableView DataKeyNames="PROFILEID">
                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                        <HeaderStyle Width="20px" />
                                    </RowIndicatorColumn>
                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                        <HeaderStyle Width="20px" />
                                    </ExpandCollapseColumn>
                                    <Columns>
                                        <telerik:GridBoundColumn DataField="PROFILEID" DataType="System.Int32" FilterControlAltText="Filter PROFILEID column"
                                            HeaderText="PROFILEID" ReadOnly="True" SortExpression="PROFILEID" UniqueName="PROFILEID">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="PROFILENAME" FilterControlAltText="Filter PROFILENAME column"
                                            HeaderText="PROFILENAME" SortExpression="PROFILENAME" UniqueName="PROFILENAME">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="PROFILETYPE" FilterControlAltText="Filter PROFILETYPE column"
                                            HeaderText="PROFILETYPE" SortExpression="PROFILETYPE" UniqueName="PROFILETYPE">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="REMARKS" FilterControlAltText="Filter REMARKS column"
                                            HeaderText="REMARKS" SortExpression="REMARKS" UniqueName="REMARKS">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="DATEADDED" DataType="System.DateTime" FilterControlAltText="Filter DATEADDED column"
                                            HeaderText="DATEADDED" SortExpression="DATEADDED" UniqueName="DATEADDED">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="LASTUPDATED" DataType="System.DateTime" FilterControlAltText="Filter LASTUPDATED column"
                                            HeaderText="LASTUPDATED" SortExpression="LASTUPDATED" UniqueName="LASTUPDATED">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridButtonColumn CommandName="Select" FilterControlAltText="Filter ID column"
                                            HeaderText="Select" Text="Select" UniqueName="Select">
                                            <HeaderStyle ForeColor="Blue" Width="100px" />
                                            <ItemStyle Width="100px" />
                                        </telerik:GridButtonColumn>
                                        <telerik:GridButtonColumn CommandName="Delete" FilterControlAltText="Filter ID column"
                                            HeaderText="" Text="Delete" UniqueName="Delete">
                                            <HeaderStyle ForeColor="Blue" Width="100px" />
                                            <ItemStyle Width="100px" />
                                        </telerik:GridButtonColumn>
                                    </Columns>
                                    <EditFormSettings>
                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                        </EditColumn>
                                    </EditFormSettings>
                                </MasterTableView>
                                <FilterMenu EnableImageSprites="False">
                                </FilterMenu>
                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                </HeaderContextMenu>
                            </telerik:RadGrid>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 116px">
                        </td>
                        <td>
                        </td>
                        <td style="width: 6px">
                        </td>
                    </tr>
                </tbody>
            </table>
        </ContentTemplate>
    </asp:UpdatePanel>
</asp:Content>
