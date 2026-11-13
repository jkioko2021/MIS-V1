<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="P_Agent_Registration.aspx.vb" Inherits="Default2" %>

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
                    <td align="center" bgcolor="#333333" colspan="4">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="REGISTRATION"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td colspan="3">
                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1121px">
                            <table style="width: 100%">
                                <tr>
                                    <td colspan="2">
                                        <telerik:RadButton ID="SEARCH_1" runat="server" Skin="Simple" 
                                            Text="Import New Agents" Width="200px">
                                        </telerik:RadButton>
                                        &nbsp;<asp:Label ID="lblIM" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                                    </td>
                                    <td>
                                        &nbsp;</td>
                                    <td>
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 580px">
                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                            Text="Search By"></asp:Label>
                                    </td>
                                    <td style="width: 154px">
                                        <telerik:RadComboBox ID="cbosearch" Runat="server" style="margin-left: 0px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cbosearch" Text="Name" 
                                                    Value="N" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbosearch" Text="Agent Code" 
                                                    Value="A" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbosearch" Text="Payroll No" 
                                                    Value="P" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtsearch" Runat="server" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td>
                                        <telerik:RadButton ID="SEARCH" runat="server" Skin="Simple" Text="Search">
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
                    <td colspan="3">
                        <asp:Panel ID="Panel34" runat="server" Height="100%" ScrollBars="Both" 
                            Width="1120px">
                            <telerik:RadGrid ID="GDSEARCH_1" runat="server" AllowPaging="True" 
                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="AGENT_CODE">
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
                                        
                                        <telerik:GridBoundColumn DataField="Agent_Code" 
                                            FilterControlAltText="Filter Agent_Code column" HeaderText="Agent_Code" 
                                            SortExpression="Agent_Code" UniqueName="Agent_Code">
                                        </telerik:GridBoundColumn>
                                    
                                        <telerik:GridBoundColumn DataField="AGENT_NAME" 
                                            FilterControlAltText="Filter AGENT_NAME column" HeaderText="Name" 
                                            SortExpression="AGENT_NAME" UniqueName="AGENT_NAME">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Agent_Type" 
                                            FilterControlAltText="Filter Agent_Type column" HeaderText="Agent_Type" 
                                            ItemStyle-Wrap="False" SortExpression="Agent_Type" UniqueName="Agent_Type">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Unit_Name" 
                                            FilterControlAltText="Filter Unit_Name column" HeaderText="Unit_Name" 
                                            SortExpression="Unit_Name" UniqueName="Unit_Name">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="REGION_NAME" 
                                            FilterControlAltText="Filter REGION_NAME column" HeaderText="Region" 
                                            SortExpression="REGION_NAME" UniqueName="REGION_NAME">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="AGENT_STATUS" 
                                            FilterControlAltText="Filter AGENT_STATUS column" HeaderText="Status" 
                                            SortExpression="AGENT_STATUS" UniqueName="AGENT_STATUS">
                                        </telerik:GridBoundColumn>
                                             <telerik:GridBoundColumn DataField="Contract_Date" 
                                            FilterControlAltText="Filter Contract_Date column" HeaderText="Contract_Date" 
                                            SortExpression="Contract_Date" UniqueName="Contract_Date">
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
                    <td colspan="3">
                        <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                            MultiPageID="RadMultiPage1" Skin="Web20" Width="1120px">
                            <Tabs>
                                <telerik:RadTab runat="server" PageViewID="V1" Text="Personal Details">
                                </telerik:RadTab>
                                <telerik:RadTab runat="server" PageViewID="V2" Text="Contract/IRA">
                                </telerik:RadTab>
                                <telerik:RadTab runat="server" Owner="RadTabStrip1" PageViewID="V4" 
                                    Text="Directors">
                                </telerik:RadTab>
                            </Tabs>
                        </telerik:RadTabStrip>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3">
                        <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1121px">
                            <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                <asp:Panel ID="Panel9" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                    Height="100%" style="font-weight: 700" Width="1090px">
                                    <table style="width: 97%">
                                        <tr>
                                            <td bgcolor="#666666" colspan="5" style="height: 25px;">
                                                <asp:Label ID="Label173" runat="server" style="font-weight: 700" 
                                                    Text="Personal Details"></asp:Label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px; height: 25px;">
                                                &nbsp;</td>
                                            <td style="width: 389px; height: 25px;" align="left">
                                                <asp:Label ID="Label148" runat="server" style="font-weight: 700" 
                                                    Text="App Number"></asp:Label>
                                            </td>
                                            <td style="width: 774px; height: 25px; text-align: left;" align="left">
                                                <asp:Label ID="lblfile" runat="server" Font-Size="Small" ForeColor="Red" 
                                                    style="font-weight: 700"></asp:Label>
                                            </td>
                                            <td class="style8" style="width: 410px; height: 25px;" align="left">
                                                &nbsp;</td>
                                            <td style="width: 287px; height: 25px; text-align: left;" align="left">
                                                &nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px" align="left">
                                                <asp:Label ID="Label102" runat="server" Text="Receive Date"></asp:Label>
                                            </td>
                                            <td style="width: 774px; text-align: left;" align="left">
                                                <telerik:RadDatePicker ID="dtreceive" Runat="server" MinDate="" Skin="Sunset">
                                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                    </Calendar>
                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                    </DateInput>
                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                </telerik:RadDatePicker>
                                            </td>
                                            <td class="style8" style="width: 410px" align="left">
                                                <asp:Label ID="Label199" runat="server" Text=" Agent No"></asp:Label>
                                            </td>
                                            <td style="width: 287px; text-align: left;" align="left">
                                                <telerik:RadTextBox ID="txtagentno" Runat="server" Enabled="False" 
                                                    Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px" align="left">
                                                <asp:Label ID="Label126" runat="server" Text="Intermediary Name"></asp:Label>
                                            </td>
                                            <td style="width: 774px; text-align: left;" align="left">
                                                <telerik:RadTextBox ID="txtname" Runat="server" Skin="Sunset" Width="350px">
                                                </telerik:RadTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px" align="left">
                                                <asp:Label ID="Label132" runat="server" Text="Agent Type"></asp:Label>
                                            </td>
                                            <td style="width: 287px; text-align: left;" align="left">
                                                <telerik:RadComboBox ID="cbotype" Runat="server" AutoPostBack="True" 
                                                    Skin="Simple" Width="200px">
                                                </telerik:RadComboBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px" align="left">
                                                <asp:Label ID="Label168" runat="server" Text="Region Name"></asp:Label>
                                            </td>
                                            <td style="width: 774px; text-align: left;" align="left">
                                                <telerik:RadComboBox ID="cboregion" Runat="server" AutoPostBack="True" 
                                                    Skin="Simple" Width="200px">
                                                    <Items>
                                                        <telerik:RadComboBoxItem runat="server" Owner="cboregion" Text="0" Value="0" />
                                                        <telerik:RadComboBoxItem runat="server" Owner="cboregion" Text="15%" 
                                                            Value="0.15" />
                                                    </Items>
                                                </telerik:RadComboBox>
                                            </td>
                                            <td class="style8" style="width: 410px" align="left">
                                                <asp:Label ID="Label167" runat="server" Text="Sales Manager"></asp:Label>
                                            </td>
                                            <td style="width: 287px; text-align: left;" align="left">
                                                <telerik:RadComboBox ID="cbosalesMgr" Runat="server" AutoPostBack="True" 
                                                    Skin="Simple" Width="250px">
                                                    <Items>
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosalesMgr" Text="0" 
                                                            Value="0" />
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosalesMgr" Text="15%" 
                                                            Value="0.15" />
                                                    </Items>
                                                </telerik:RadComboBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px" align="left">
                                                <asp:Label ID="Label202" runat="server" Text="GI Manager"></asp:Label>
                                            </td>
                                            <td style="width: 774px; text-align: left;" align="left">
                                                <telerik:RadComboBox ID="cbosalesGI" Runat="server" 
                                                    Skin="Simple" Width="250px">
                                                    <Items>
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosalesGI" Text="0" Value="0" />
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbosalesGI" Text="15%" 
                                                            Value="0.15" />
                                                    </Items>
                                                </telerik:RadComboBox>
                                            </td>
                                            <td class="style8" style="width: 410px" align="left">
                                                &nbsp;</td>
                                            <td style="width: 287px; text-align: left;" align="left">
                                                &nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px" align="left">
                                                <asp:Label ID="Label169" runat="server" Text="Pin No"></asp:Label>
                                            </td>
                                            <td style="width: 774px; text-align: left;" align="left">
                                                <telerik:RadTextBox ID="txtpin" Runat="server" Skin="Sunset" Width="250px">
                                                </telerik:RadTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px" align="left">
                                                <asp:Label ID="Label170" runat="server" Text="ID No/Reg No"></asp:Label>
                                            </td>
                                            <td style="width: 287px; text-align: left;" align="left">
                                                <telerik:RadTextBox ID="txtid" Runat="server" Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px" align="left">
                                                <asp:Label ID="Label197" runat="server" Text="Contract Date"></asp:Label>
                                            </td>
                                            <td style="width: 774px; text-align: left;" align="left">
                                                <telerik:RadDatePicker ID="dtcontract" Runat="server" MinDate="" Skin="Sunset">
                                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                    </Calendar>
                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                    </DateInput>
                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                </telerik:RadDatePicker>
                                            </td>
                                            <td class="style8" style="width: 410px" align="left">
                                                <asp:Label ID="Label189" runat="server" Text="PayRoll No"></asp:Label>
                                            </td>
                                            <td style="width: 287px; text-align: left;" align="left">
                                                <telerik:RadTextBox ID="txtPayroll" Runat="server" Enabled="False" 
                                                    Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td bgcolor="#666666" colspan="5" style="text-align: left" align="left">
                                                <asp:Label ID="Label155" runat="server" style="font-weight: 700" 
                                                    Text="Contact Details"></asp:Label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px" align="left">
                                                <asp:Label ID="Label166" runat="server" Text="Pri Mobile No"></asp:Label>
                                            </td>
                                            <td style="width: 774px; text-align: left;" align="left">
                                                <telerik:RadTextBox ID="txtMobile" Runat="server" Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px" align="left">
                                                <asp:Label ID="Label172" runat="server" Text="Sec Mobile No"></asp:Label>
                                            </td>
                                            <td style="width: 287px; text-align: left;" align="left">
                                                <telerik:RadTextBox ID="txtMobile2" Runat="server" Skin="Sunset" Width="200px">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px">
                                                &nbsp;</td>
                                            <td style="width: 389px" align="left">
                                                <asp:Label ID="Label171" runat="server" Text="Email"></asp:Label>
                                            </td>
                                            <td style="width: 774px; text-align: left;" align="left">
                                                <telerik:RadTextBox ID="txtemail" Runat="server" Skin="Sunset" Width="250px">
                                                </telerik:RadTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px" align="left">
                                                &nbsp;</td>
                                            <td style="width: 287px; text-align: left;" align="left">
                                                &nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td bgcolor="#666666" colspan="5" align="left">
                                                <asp:Label ID="Label187" runat="server" style="font-weight: 700" 
                                                    Text="Commission Details"></asp:Label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px; height: 11px;">
                                                &nbsp;</td>
                                            <td style="width: 389px; height: 11px;" align="left">
                                                <asp:Label ID="Label186" runat="server" Text="Commission Rate"></asp:Label>
                                            </td>
                                            <td style="width: 774px; height: 11px; text-align: left;" align="left">
                                                <telerik:RadNumericTextBox ID="txtrate" Runat="server" Culture="en-US" 
                                                    Value="0.1" Width="125px" Skin="Simple">
                                                </telerik:RadNumericTextBox>
                                            </td>
                                            <td class="style8" style="width: 410px; height: 11px;" align="left">
                                                <asp:Label ID="Label188" runat="server" Text="Pay Frequency"></asp:Label>
                                            </td>
                                            <td style="width: 287px; height: 11px;" align="left">
                                                <telerik:RadComboBox ID="cbofreq" Runat="server" AutoPostBack="True" 
                                                    Skin="Simple">
                                                    <Items>
                                                        <telerik:RadComboBoxItem runat="server" Value="0" />
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbofreq" Text="Daily" 
                                                            Value="1" />
                                                        <telerik:RadComboBoxItem runat="server" Owner="cbofreq" Text="Weekly" 
                                                            Value="7" />
                                                        <telerik:RadComboBoxItem runat="server" Text="Bi-Weekly" Value="14" />
                                                        <telerik:RadComboBoxItem runat="server" Text="Monthly" Value="30" />
                                                    </Items>
                                                </telerik:RadComboBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px; height: 11px;">
                                                &nbsp;</td>
                                            <td style="width: 389px; height: 11px;" align="left">
                                                &nbsp;</td>
                                            <td style="width: 774px; height: 11px;" align="left">
                                                &nbsp;</td>
                                            <td class="style8" style="width: 410px; height: 11px;" align="left">
                                                <asp:Label ID="Label201" runat="server" Text="ETims "></asp:Label>
                                            </td>
                                            <td style="width: 287px; height: 11px;" align="left">
                                                <asp:CheckBox ID="chketims" runat="server" Text="Integrated" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height: 11px;" colspan="5">
                                                <hr />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width: 205px; height: 41px;">
                                                &nbsp;</td>
                                            <td style="width: 389px; height: 41px;">
                                                &nbsp;</td>
                                            <td style="width: 774px; height: 41px;" align="left">
                                                <telerik:RadButton ID="cmdsave" runat="server" Height="35px" Skin="Simple" 
                                                    Text="Save" Width="98px">
                                                </telerik:RadButton>
                                                &nbsp;<telerik:RadButton ID="cmdedit" runat="server" Height="35px" Skin="Simple" 
                                                    Text="Edit" Width="98px">
                                                </telerik:RadButton>
                                            </td>
                                            <td class="style8" style="width: 410px; height: 41px;">
                                                &nbsp;</td>
                                            <td style="width: 287px; height: 41px;">
                                                <asp:HiddenField ID="HiddenField1" runat="server" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="5">
                                                <asp:Label ID="lblerr" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                                            </td>
                                        </tr>
                                    </table>
                                </asp:Panel>
                            </telerik:RadPageView>
                             <telerik:RadPageView ID="V2" runat="server">
                                 <asp:Panel ID="Panel4" runat="server" BorderStyle="Solid" BorderWidth="1px">
                                     <table style="width: 100%">
                                         <tr>
                                             <td bgcolor="#666666" colspan="4" style="height: 13px">
                                                 <asp:Label ID="Label7" runat="server" Font-Bold="True" 
                                                     Text="IRA/Contract Details"></asp:Label>
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8" colspan="4">
                                                 <asp:Panel ID="Panel37" runat="server" Height="100%" ScrollBars="Both" 
                                                     Width="100%">
                                                     <telerik:RadGrid ID="GD_CONTRACT" runat="server" AllowPaging="True" 
                                                         CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                         <MasterTableView AutoGenerateColumns="False">
                                                             <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                             <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                 <HeaderStyle Width="20px" />
                                                             </RowIndicatorColumn>
                                                             <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                 <HeaderStyle Width="20px" />
                                                             </ExpandCollapseColumn>
                                                             <Columns>
                                                         
                                                                 <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                                     HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="REF_NO" 
                                                                     FilterControlAltText="Filter REF_NO column" HeaderText="Ref_No" 
                                                                     SortExpression="REF_NO" UniqueName="REF_NO">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Licence_No" 
                                                                     FilterControlAltText="Filter Licence_No column" HeaderText="Licence_No" 
                                                                     SortExpression="Licence_No" UniqueName="Licence_No">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Valid_From" 
                                                                     FilterControlAltText="Filter Valid_From column" HeaderText="Valid_From" 
                                                                     ItemStyle-Wrap="False" SortExpression="Valid_From" UniqueName="Valid_From">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Valid_To" 
                                                                     FilterControlAltText="Filter Valid_To column" HeaderText="Valid_To" 
                                                                     SortExpression="Valid_To" UniqueName="Valid_To">
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
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 17px; width: 167px;" align="left">
                                                 <asp:Label ID="Label196" runat="server" Text="Document Name"></asp:Label>
                                             </td>
                                             <td class="style8" align="left">
                                                 <telerik:RadComboBox ID="cbodoc" Runat="server" AutoPostBack="True" 
                                                     Skin="Simple" Width="210px">
                                                     <Items>
                                                         <telerik:RadComboBoxItem runat="server" Owner="cbodoc" Text="0" Value="0" />
                                                         <telerik:RadComboBoxItem runat="server" Owner="cbodoc" 
                                                             Text="New Application/Licence" Value="C001" />
                                                         <telerik:RadComboBoxItem runat="server" Owner="cbodoc" Text="Others" 
                                                             Value="C002" />
                                                     </Items>
                                                 </telerik:RadComboBox>
                                             </td>
                                             <td style="width: 129px; height: 17px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 17px;" align="left">
                                                 &nbsp;</td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 17px; width: 167px;" align="left">
                                                 <asp:Label ID="Label158" runat="server" Text="Licence No."></asp:Label>
                                             </td>
                                             <td class="style8" align="left">
                                                 <telerik:RadTextBox ID="txtlicence" Runat="server" Skin="Sunset" Width="250px">
                                                 </telerik:RadTextBox>
                                             </td>
                                             <td style="width: 129px; height: 17px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 17px;" align="left">
                                                 <asp:CheckBox ID="chkcon" runat="server" Text="Contract Signed" />
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 167px;" align="left">
                                                 <asp:Label ID="Label200" runat="server" Text="Year"></asp:Label>
                                             </td>
                                             <td class="style8" style="width: 338px; height: 16px;" align="left">
                                                 <telerik:RadComboBox ID="cboyear" Runat="server" AutoPostBack="True" 
                                                     Skin="Simple" Width="210px">
                                                     <Items>
                                                         <telerik:RadComboBoxItem runat="server" Selected="True" Text="2024" 
                                                             Value="2024" />
                                                         <telerik:RadComboBoxItem runat="server" Text="2025" Value="2025" />
                                                         <telerik:RadComboBoxItem runat="server" Text="2026" Value="2026" />
                                                     </Items>
                                                 </telerik:RadComboBox>
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 <asp:CheckBox ID="chkira" runat="server" Text="IRA Compliance" />
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 167px;" align="left">
                                                 <asp:Label ID="Label10" runat="server" Text="Valid From"></asp:Label>
                                             </td>
                                             <td class="style8" style="width: 338px; height: 16px;" align="left">
                                                 <telerik:RadDatePicker ID="dtLicetart" Runat="server" Enabled="False" 
                                                     MinDate="" Skin="Sunset">
                                                     <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                         UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                     </Calendar>
                                                     <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                     </DateInput>
                                                     <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                 </telerik:RadDatePicker>
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 <asp:CheckBox ID="chkkyc" runat="server" Text="KYC Compliance" />
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 167px;" align="left">
                                                 <asp:Label ID="Label11" runat="server" Text="Valid To"></asp:Label>
                                             </td>
                                             <td class="style8" style="width: 338px; height: 16px;" align="left">
                                                 <telerik:RadDatePicker ID="dtLiceend" Runat="server" MinDate="" Skin="Sunset">
                                                     <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                         UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                     </Calendar>
                                                     <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                     </DateInput>
                                                     <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                 </telerik:RadDatePicker>
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 167px;" align="left">
                                                 &nbsp;</td>
                                             <td class="style8" style="width: 338px; height: 16px;" align="left">
                                                 <asp:FileUpload ID="FL1" runat="server" Width="330px" />
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 167px;" align="left">
                                                 <asp:Label ID="Label121" runat="server" style="font-weight: 700" 
                                                     Text="Comments"></asp:Label>
                                             </td>
                                             <td class="style8" rowspan="3" align="left">
                                                 <telerik:RadTextBox ID="txtcomm" Runat="server" Height="70px" Rows="1" 
                                                     Skin="Sunset" TextMode="MultiLine" Width="450px">
                                                 </telerik:RadTextBox>
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 167px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 167px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 167px;" align="left">
                                                 <asp:CheckBox ID="chkwaiver" runat="server" style="font-weight: 700" 
                                                     Text="Waiver" />
                                             </td>
                                             <td class="style8" style="width: 338px; height: 16px;" align="left">
                                                 <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Update">
                                                 </telerik:RadButton>
                                                 <asp:Label ID="lblupload" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                     ForeColor="Red"></asp:Label>
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                         </tr>
                                         <tr>
                                             <td class="style8" colspan="4" style="height: 16px; ">
                                                 <asp:Panel ID="Panel2" runat="server" Width="1118px">
                                                     <table style="width: 99%">
                                                         <tr>
                                                             <td>
                                                                 <asp:Panel ID="Panel32" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                                                     Height="100%" Width="1109px">
                                                                     <table style="width: 99%">
                                                                         <tr>
                                                                             <td bgcolor="#666666">
                                                                                 <asp:Label ID="Label151" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                                             </td>
                                                                         </tr>
                                                                         <tr>
                                                                             <td>
                                                                                 <asp:Panel ID="Panel33" runat="server" Height="100%" ScrollBars="Both" 
                                                                                     Width="1100px">
                                                                                     <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                                         GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                                         <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                                             <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                             <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                 <HeaderStyle Width="20px" />
                                                                                             </RowIndicatorColumn>
                                                                                             <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                 <HeaderStyle Width="20px" />
                                                                                             </ExpandCollapseColumn>
                                                                                             <Columns>
                                                                                                 
                                                                                                 <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                                                     FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                                                     SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                                                 </telerik:GridBoundColumn>
                                                                                                 <telerik:GridBoundColumn DataField="Ref_No" 
                                                                                                     FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                                                                                     SortExpression="Ref_No" UniqueName="Ref_No">
                                                                                                 </telerik:GridBoundColumn>
                                                                                                 <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                                                     FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                                                     SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                                                 </telerik:GridBoundColumn>
                                                                                                 <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                                                     FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                                                     SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                                                 </telerik:GridBoundColumn>
                                                                                                 <telerik:GridBoundColumn DataField="File_Name" 
                                                                                                     FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                                                     SortExpression="File_Name" UniqueName="File_Name">
                                                                                                 </telerik:GridBoundColumn>
                                                                                                 <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                                     FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                                     SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                                 </telerik:GridBoundColumn>
                                                                                                 <telerik:GridTemplateColumn AllowFiltering="false" HeaderText="View" 
                                                                                                     SortExpression="DOC_ID">
                                                                                                     <ItemTemplate>
                                                                                                         <asp:LinkButton ID="lnkDownload" runat="server" 
                                                                                                             CommandArgument='<%# Eval("DOC_ID") %>' OnClick="DownloadFile" Text="Download"></asp:LinkButton>
                                                                                                     </ItemTemplate>
                                                                                                 </telerik:GridTemplateColumn>
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
                                                                             <td>
                                                                                 <asp:Panel ID="Panel13" runat="server" BorderStyle="Solid" Height="100%" 
                                                                                     ScrollBars="Horizontal" Width="1100px">
                                                                                     <asp:Literal ID="ltEmbed" runat="server" />
                                                                                 </asp:Panel>
                                                                             </td>
                                                                         </tr>
                                                                     </table>
                                                                 </asp:Panel>
                                                             </td>
                                                         </tr>
                                                     </table>
                                                 </asp:Panel>
                                             </td>
                                         </tr>
                                     </table>
                                 </asp:Panel>
                            </telerik:RadPageView>
                              <telerik:RadPageView ID="V4" runat="server">
                                 <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px">
                                     <table style="width: 100%">
                                         <tr>
                                             <td bgcolor="#666666" colspan="4" style="height: 13px">
                                                 <asp:Label ID="Label1" runat="server" Font-Bold="True" Text="Directors"></asp:Label>
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8" colspan="4">
                                                 <asp:Panel ID="Panel3" runat="server" Height="100%" ScrollBars="Both" 
                                                     Width="100%">
                                                     <telerik:RadGrid ID="GD_DIRE" runat="server" AllowPaging="True" CellSpacing="0" 
                                                         GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                         <MasterTableView AutoGenerateColumns="False" DataKeyNames="ID">
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
                                                                 <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                                     HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="NAME" 
                                                                     FilterControlAltText="Filter NAME column" HeaderText="Full_Name" 
                                                                     SortExpression="NAME" UniqueName="NAME">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="NID_NO" 
                                                                     FilterControlAltText="Filter NID_NO column" HeaderText="ID_No" 
                                                                     SortExpression="NID_NO" UniqueName="NID_NO">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Mobile_No" 
                                                                     FilterControlAltText="Filter Mobile_No column" HeaderText="Mobile_No" 
                                                                     ItemStyle-Wrap="False" SortExpression="Mobile_No" UniqueName="Mobile_No">
                                                                 </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Email" 
                                                                     FilterControlAltText="Filter Email column" HeaderText="Email" 
                                                                     SortExpression="Email" UniqueName="Email">
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
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 17px; width: 127px;" align="left">
                                                 <asp:Label ID="Label2" runat="server" Text="Full Name"></asp:Label>
                                             </td>
                                             <td class="style8" align="left">
                                                 <telerik:RadTextBox ID="txtdir" Runat="server" Skin="Sunset" Width="350px">
                                                 </telerik:RadTextBox>
                                             </td>
                                             <td style="width: 129px; height: 17px;" align="left">
                                                 <asp:Label ID="Label3" runat="server" Text="ID Number"></asp:Label>
                                             </td>
                                             <td style="width: 287px; height: 17px;" align="left">
                                                 <telerik:RadTextBox ID="txtdireid" Runat="server" Skin="Sunset" Width="200px">
                                                 </telerik:RadTextBox>
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 127px;" align="left">
                                                 <asp:Label ID="Label4" runat="server" Text="Mobile No"></asp:Label>
                                             </td>
                                             <td class="style8" style="width: 338px; height: 16px;" align="left">
                                                 <telerik:RadTextBox ID="txtdirmob" Runat="server" Skin="Sunset" 
                                                     Width="200px">
                                                 </telerik:RadTextBox>
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 <asp:Label ID="Label5" runat="server" Text="Email"></asp:Label>
                                             </td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 <telerik:RadTextBox ID="txtdiremail" Runat="server" Skin="Sunset" Width="250px">
                                                 </telerik:RadTextBox>
                                             </td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 127px;" align="left">
                                                 <asp:Label ID="Label198" runat="server" Text="Pin No"></asp:Label>
                                             </td>
                                             <td class="style8" style="width: 338px; height: 16px;" align="left">
                                                 <telerik:RadTextBox ID="txtdirepin" Runat="server" Skin="Sunset" Width="250px">
                                                 </telerik:RadTextBox>
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                         </tr>
                                         <tr>
                                             <td class="style8" style="height: 16px; width: 127px;" align="left">
                                                 &nbsp;</td>
                                             <td class="style8" style="width: 338px; height: 16px;" align="left">
                                                 <telerik:RadButton ID="RadButton3" runat="server" Skin="Simple" Text="Update">
                                                 </telerik:RadButton>
                                                 <asp:Label ID="lbldir" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                                             </td>
                                             <td style="width: 129px; height: 16px;" align="left">
                                                 &nbsp;</td>
                                             <td style="width: 287px; height: 16px;" align="left">
                                                 <asp:HiddenField ID="HiddenField2" runat="server" />
                                             </td>
                                         </tr>
                                     </table>
                                 </asp:Panel>
                            </telerik:RadPageView>
                        </telerik:RadMultiPage>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3">
                        <asp:Panel ID="Panel35" runat="server" BorderColor="#000001" 
                            BorderStyle="Solid" BorderWidth="1px" Width="1116px">
                            <table style="width: 100%">
                                <tr>
                                    <td bgcolor="#666666" colspan="2">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 159px">
                                        &nbsp;</td>
                                    <td align="left">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 159px">
                                        &nbsp;</td>
                                    <td align="left">
                                        <asp:CheckBox ID="chkcompl" runat="server" Text="Is Complete" />
                                    </td>
                                </tr>
                                <tr>
                                    <td align="right" style="width: 159px; height: 33px;">
                                        </td>
                                    <td style="height: 33px" align="left">
                                        <telerik:RadButton ID="btnsubmit" runat="server" Skin="Simple" Text="Submit" 
                                            Width="150px">
                                        </telerik:RadButton>
                                        <asp:Label ID="lblsub" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2">
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
                <tr>
                    <td colspan="4">
                        &nbsp;</td>
                </tr>
                <tr>
                    <td style="width: 105px">
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
          <Triggers>
        <asp:PostBackTrigger ControlID = "btnupload" />
          </Triggers>
    </asp:UpdatePanel>
</asp:Content>
