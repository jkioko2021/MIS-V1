<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Registration.aspx.vb" Inherits="Default2" %>
<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#CC0000" 
                Text="Please Wait...." Font-Size="Large"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">

            <ContentTemplate>

                <div id="maincontainer">
         
                            <table style="width: 1200">
                                <tr>
                                    <td style="height: 3px">
                                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                            Width="1200px">
                                            <table style="width: 100%">
                                                <tr>
                                                    <td align="center" bgcolor="Gray" colspan="4">
                                                        <asp:Label ID="Label87" runat="server" style="font-weight: 700" 
                                                            Text="Business Tracking"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="width: 500px">
                                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                                            Text="Search By"></asp:Label>
                                                    </td>
                                                    <td>
                                                        <telerik:RadComboBox ID="cbosearch" Runat="server">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Text="File No" Value="F" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Member No" Value="M" />
                                                                <telerik:RadComboBoxItem runat="server" Text="User" Value="U" />
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
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel7" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="1200px">
                                            <telerik:RadGrid ID="GDSEARCH" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridButtonColumn CommandName="Select" 
                                                            FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                            UniqueName="Select">
                                                            <HeaderStyle ForeColor="Blue" Width="100px" />
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridButtonColumn>
                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                            FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                            SortExpression="File_No" UniqueName="File_No">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                            FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                            SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Member_No" 
                                                            FilterControlAltText="Filter Member_No column" HeaderText="Member_No" 
                                                            SortExpression="Member_No" UniqueName="Member_No">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Type" 
                                                            FilterControlAltText="Filter Type column" HeaderText="Type" 
                                                            SortExpression="Type" UniqueName="Type">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Assigned_To" 
                                                            FilterControlAltText="Filter Assigned_To column" HeaderText="Assigned_To" 
                                                            SortExpression="Assigned_To" UniqueName="Assigned_To">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Status" 
                                                            FilterControlAltText="Filter Status column" HeaderText="Status" 
                                                            SortExpression="Status" UniqueName="Status">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                            ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                            Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                            <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                            <ItemStyle CssClass="ButtonColumn" />
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
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#666666">
                                        <asp:Label ID="Label28" runat="server" Font-Bold="True" Text="REGISTER"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                            Height="100%" style="font-weight: 700" Width="1200px">
                                            <table style="width: 100%">
                                                <tr>
                                                    <td class="style8" style="width: 155px">
                                                        <asp:Label ID="Label10" runat="server" style="font-weight: 700" 
                                                            Text="New/Renewal"></asp:Label>
                                                    </td>
                                                    <td style="width: 263px" colspan="2">
                                                        <telerik:RadComboBox ID="cborenewnew" Runat="server" Skin="Web20">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Text="New" Value="New" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Renew" Value="Renew" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Addon" Value="Addon" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Deletion" Value="Deletion" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Refunds" Value="Refunds" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Re-Instatement" 
                                                                    Value="Re-Instatement" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Suspension" Value="Suspension" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style8" style="width: 161px">
                                                        <asp:Label ID="Label31" runat="server" style="font-weight: 700" Text="Type"></asp:Label>
                                                    </td>
                                                    <td style="width: 287px">
                                                        <telerik:RadComboBox ID="cbotype" Runat="server" Skin="Sunset" Width="150px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Owner="cbotype" />
                                                                <telerik:RadComboBoxItem runat="server" Text="RETAIL" Value="R" 
                                                                    Owner="cbotype" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cbotype" Text="SME" Value="S" />
                                                                <telerik:RadComboBoxItem runat="server" Text="CORP" Value="C" Owner="cbotype" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 155px">
                                                        <asp:Label ID="Label33" runat="server" Text="Member NO."></asp:Label>
                                                        &nbsp;</td>
                                                    <td style="width: 263px" colspan="2">
                                                        <telerik:RadTextBox ID="txtretail" Runat="server" Skin="Sunset" Width="150px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                    <td class="style8" style="width: 161px">
                                                        <asp:Label ID="Label30" runat="server" Text="Proposer"></asp:Label>
                                                    </td>
                                                    <td style="width: 287px">
                                                        <telerik:RadTextBox ID="txtproposer" Runat="server" Skin="Sunset" Width="250px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="#666666" class="style8" colspan="5">
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 155px">
                                                        <asp:Label ID="Label32" runat="server" Text="Receive Date"></asp:Label>
                                                    </td>
                                                    <td style="width: 263px" colspan="2">
                                                        <telerik:RadDatePicker ID="dtreceivedate" Runat="server" Skin="Sunset" 
                                                            MinDate="">
                                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                            </Calendar>
                                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                            </DateInput>
                                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                        </telerik:RadDatePicker>
                                                    </td>
                                                    <td class="style8" style="width: 161px">
                                                        <asp:Label ID="Label34" runat="server" Text="Receive From"></asp:Label>
                                                    </td>
                                                    <td style="width: 287px">
                                                        <telerik:RadTextBox ID="txtReceiveFrom" Runat="server" Skin="Sunset" 
                                                            Width="250px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 155px">
                                                        <asp:Label ID="Label14" runat="server" Text="Agent/Broker"></asp:Label>
                                                    </td>
                                                    <td style="width: 263px" colspan="2">
                                                        <telerik:RadComboBox ID="cboagent" Runat="server" Skin="Sunset" Width="250px" 
                                                            AllowCustomText="True" AccessibilityMode="True" 
                                                            MarkFirstMatch="True">
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style8" style="width: 161px">
                                                        &nbsp;</td>
                                                    <td style="width: 287px">
                                                        <telerik:RadTextBox ID="txtagent" Runat="server" Skin="Sunset" Width="250px" 
                                                            Enabled="False" Visible="False">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 155px">
                                                        <asp:Label ID="Label36" runat="server" Text="Population"></asp:Label>
                                                    </td>
                                                    <td style="width: 263px" colspan="2">
                                                        <telerik:RadNumericTextBox ID="txtpopulation" Runat="server" Skin="Sunset" 
                                                            Width="200px" DataType="System.Int16" Culture="en-US" Value="0">
                                                            <NumberFormat DecimalDigits="0" />
                                                        </telerik:RadNumericTextBox>
                                                    </td>
                                                    <td class="style8" style="width: 161px">
                                                        &nbsp;</td>
                                                    <td style="width: 287px">
                                                        <asp:CheckBox ID="chkaarcredit" runat="server" AutoPostBack="True" 
                                                            Text="AAR Credit" />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 155px">
                                                        <asp:Label ID="Label35" runat="server" Text="Benefit"></asp:Label>
                                                    </td>
                                                    <td style="width: 263px" colspan="2">
                                                        <telerik:RadComboBox ID="cboBenefit" Runat="server" Skin="Sunset" Width="200px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBenefit" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBenefit" Text="IP Only" 
                                                                    Value="IP Only" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBenefit" Text="OP Only" 
                                                                    Value="OP Only" />
                                                                <telerik:RadComboBoxItem runat="server" Owner="cboBenefit" Text="IP/OP" 
                                                                    Value="IP/OP" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style8" style="width: 161px">
                                                        <asp:Label ID="Label19" runat="server" Text="Comment"></asp:Label>
                                                    </td>
                                                    <td rowspan="2" style="width: 287px">
                                                        <telerik:RadTextBox ID="txtcomment" Runat="server" Height="45px" Skin="Sunset" 
                                                            Width="250px" TextMode="MultiLine">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 155px">
                                                        <asp:Label ID="Label13" runat="server" Text="Premium Amt"></asp:Label>
                                                    </td>
                                                    <td style="width: 263px" colspan="2">
                                                        <telerik:RadNumericTextBox ID="txtpremium" Runat="server" Skin="Sunset" 
                                                            Width="200px" Culture="en-US" Value="0">
                                                        </telerik:RadNumericTextBox>
                                                    </td>
                                                    <td class="style8" style="width: 161px">
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 155px">
                                                        <asp:Label ID="Label57" runat="server" Text="File No"></asp:Label>
                                                    </td>
                                                    <td style="width: 263px" colspan="2">
                                                        <asp:Label ID="lblfileno" runat="server" Font-Size="Large" 
                                                            style="color: #FF0000"></asp:Label>
                                                    </td>
                                                    <td class="style8" style="width: 161px">
                                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                                    </td>
                                                    <td style="width: 287px">
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="#666666" class="style8" colspan="5">
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" colspan="3" style="height: 35px">
                                                        <asp:Label ID="lblerr" runat="server" ForeColor="Red"></asp:Label>
                                                    </td>
                                                    <td class="style8" style="width: 161px; height: 35px;">
                                                        <telerik:RadButton ID="cmdsave" runat="server" Height="30px" Skin="Sunset" 
                                                            Text="Save" Width="80px">
                                                        </telerik:RadButton>
                                                    </td>
                                                    <td style="width: 287px; height: 35px;">
                                                        &nbsp;<telerik:RadButton ID="cmdedit" runat="server" Skin="Sunset" Text="Edit" 
                                                            Width="80px">
                                                        </telerik:RadButton>
                                                        &nbsp;<telerik:RadButton ID="cmddelete" runat="server" Skin="Sunset" Text="Delete" 
                                                            Width="80px">
                                                        </telerik:RadButton>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="#666666" colspan="5">
                                                        <asp:Label ID="Label86" runat="server" Text="Report Extract (Entry Date)"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="width: 122px">
                                                        <asp:Label ID="Label81" runat="server" Text="Date From"></asp:Label>
                                                    </td>
                                                    <td class="style8" colspan="2">
                                                        <telerik:RadDatePicker ID="dtDateFrom" Runat="server" Skin="Web20">
                                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                            </Calendar>
                                                            <DateInput DateFormat="M/d/yyyy" DisplayDateFormat="M/d/yyyy">
                                                            </DateInput>
                                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                        </telerik:RadDatePicker>
                                                    </td>
                                                    <td style="width: 287px">
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" colspan="2" style="width: 122px; height: 42px;">
                                                        <asp:Label ID="Label82" runat="server" Text="Date To"></asp:Label>
                                                    </td>
                                                    <td class="style8" colspan="2" style="height: 42px">
                                                        <telerik:RadDatePicker ID="dtDateTo" Runat="server" Skin="Sunset" Width="150px">
                                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                            </Calendar>
                                                            <DateInput DateFormat="M/d/yyyy" DisplayDateFormat="M/d/yyyy">
                                                            </DateInput>
                                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                        </telerik:RadDatePicker>
                                                    </td>
                                                    <td style="width: 287px; height: 42px;">
                                                        <telerik:RadButton ID="RadButton1" runat="server" Skin="Sunset" Text="Generate" 
                                                            Width="80%" Height="39px">
                                                        </telerik:RadButton>
                                                    </td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                 
       </div>
            </ContentTemplate>
            </asp:UpdatePanel>
</asp:Content>

