<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="P_Agent_Suspension.aspx.vb" Inherits="Default2" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="width: 100%" align="center">
                <tr>
                    <td align="center" bgcolor="#333333" colspan="2">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="AGENT SUSPENSION"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td style="width: 580px">
                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                            Text="Search By"></asp:Label>
                                    </td>
                                    <td style="width: 154px">
                                        <telerik:RadComboBox ID="cbosearch" Runat="server" style="margin-left: 0px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Text="Name" Value="N" />
                                                <telerik:RadComboBoxItem runat="server" Text="Agent Code" Value="A" />
                                                <telerik:RadComboBoxItem runat="server" Text="Payroll No" Value="P" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtsearch" Runat="server" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td>
                                        <telerik:RadButton ID="SEARCH" runat="server" Text="Search">
                                        </telerik:RadButton>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel34" runat="server" Height="100%" ScrollBars="Both" 
                            Width="1120px">
                            <telerik:RadGrid ID="GDSEARCH_1" runat="server" AllowPaging="True" 
                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="Ref_No">
                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                        <HeaderStyle Width="20px" />
                                    </RowIndicatorColumn>
                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                        <HeaderStyle Width="20px" />
                                    </ExpandCollapseColumn>
                                    <Columns>
                                        <telerik:GridButtonColumn CommandName="Select" 
                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                            UniqueName="Select">
                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                            <ItemStyle Width="50px" />
                                        </telerik:GridButtonColumn>
                                        
                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                            SortExpression="Ref_No" UniqueName="Ref_No">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="AGENT_NAME" 
                                            FilterControlAltText="Filter AGENT_NAME column" HeaderText="Name" 
                                            SortExpression="AGENT_NAME" UniqueName="AGENT_NAME">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Agent_Type" 
                                            FilterControlAltText="Filter Agent_Type column" HeaderText="Agent_Type" 
                                            ItemStyle-Wrap="False" SortExpression="Agent_Type" UniqueName="Agent_Type">
                                        </telerik:GridBoundColumn>
                                      
                                        <telerik:GridBoundColumn DataField="AGENT_STATUS" 
                                            FilterControlAltText="Filter AGENT_STATUS column" HeaderText="Status" 
                                            SortExpression="AGENT_STATUS" UniqueName="AGENT_STATUS">
                                        </telerik:GridBoundColumn>
                                     
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
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel4" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Label ID="lblfile" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        <asp:Label ID="Label197" runat="server" Text="Action"></asp:Label>
                                    </td>
                                    <td class="style8" style="width: 476px">
                                        <telerik:RadComboBox ID="cboact" Runat="server" AutoPostBack="True" 
                                            Skin="Simple" Width="210px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cboact" Text="0" Value="0" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cboact" Text="Suspension" 
                                                    Value="S" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cboact" Text="Termination" 
                                                    Value="T" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cboact" 
                                                    Text="Lift Susp/Termination" Value="A" />
                                                <telerik:RadComboBoxItem runat="server" Text="Deactivate" Value="D" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 115px; height: 17px;">
                                        <asp:Label ID="Label10" runat="server" Text="Effective Date"></asp:Label>
                                    </td>
                                    <td style="width: 287px; height: 17px;">
                                        <telerik:RadDatePicker ID="dteff" Runat="server" MinDate="" Skin="Sunset">
                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                            </Calendar>
                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                            </DateInput>
                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                        </telerik:RadDatePicker>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        <asp:Label ID="Label196" runat="server" Text="Reasons"></asp:Label>
                                    </td>
                                    <td class="style8" style="width: 476px">
                                        <telerik:RadComboBox ID="cboreasons" Runat="server" AutoPostBack="True" 
                                            Skin="Simple" Width="210px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cboreasons" Text="0" Value="0" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cboreasons" Selected="True" 
                                                    Text="Fraud Investigation" Value="FI" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cboreasons" 
                                                    Text="Gross Misconduct" Value="GM" />
                                                <telerik:RadComboBoxItem runat="server" Text="Compliance" Value="C" />
                                                <telerik:RadComboBoxItem runat="server" Text="Incomplete KYC" Value="IK" />
                                                <telerik:RadComboBoxItem runat="server" Text="Other" Value="O" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 115px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        <asp:Label ID="Label121" runat="server" style="font-weight: 700" 
                                            Text="Comments"></asp:Label>
                                    </td>
                                    <td rowspan="2" style="width: 476px">
                                        <telerik:RadTextBox ID="txtcomment" Runat="server" Height="70px" Rows="1" 
                                            Skin="Sunset" TextMode="MultiLine" Width="450px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 115px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        &nbsp;</td>
                                    <td style="width: 115px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        &nbsp;</td>
                                    <td class="style8" style="width: 476px; height: 16px;">
                                        <telerik:RadButton ID="btnsubmit" runat="server" Skin="Simple" Text="Update">
                                        </telerik:RadButton>
                                        <asp:Label ID="lblupload" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                    <td style="width: 115px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        &nbsp;</td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel35" runat="server" BorderColor="#000001" 
                            BorderStyle="Solid" BorderWidth="1px" Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="98%">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                                            ItemStyle-Width="50" SortExpression="Ref_No" UniqueName="Ref_No">
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                            SortExpression="Notes" UniqueName="Notes">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <ItemStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
      
    </asp:UpdatePanel>
</asp:Content>

